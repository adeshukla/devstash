import 'server-only'
import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import zlib from 'node:zlib'
import { isPrivateAddress, parseWebAddress } from './pageImage.ts'

export class FetchRefused extends Error {}

export interface Got {
  url: URL
  type: string
  body: Buffer
}

interface Opts {
  accept: string
  /** Largest body to accept when it is not a page. */
  maxBytes: number
  /** Pages are cut off here instead of refused: the picture is named near the top. */
  htmlBytes: number
  timeoutMs: number
}

/** Resolves the host itself and refuses private addresses, so a name cannot point us inside the network. */
const guardedLookup = ((
  host: string,
  options: { all?: boolean } | number,
  cb: (...a: unknown[]) => void
) => {
  const all = typeof options === 'object' && options.all
  dns.lookup(host, { all: true }, (err, addrs) => {
    if (err) return cb(err)
    if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address)))
      return cb(new FetchRefused('Only public web addresses work.'))
    if (all) return cb(null, addrs)
    cb(null, addrs[0].address, addrs[0].family)
  })
}) as unknown as net.LookupFunction

function once(url: URL, o: Opts): Promise<{ res: http.IncomingMessage; url: URL }> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http
    const req = lib.request(
      url,
      {
        method: 'GET',
        lookup: guardedLookup,
        timeout: o.timeoutMs,
        headers: {
          accept: o.accept,
          'accept-encoding': 'gzip, deflate, br',
          'user-agent': 'DevStash-Lab/1.0 (+https://devstash.me/lab)',
        },
      },
      (res) => resolve({ res, url })
    )
    req.on('timeout', () => req.destroy(new FetchRefused('That site took too long to answer.')))
    req.on('error', (e) =>
      reject(e instanceof FetchRefused ? e : new FetchRefused('That address could not be reached.'))
    )
    req.end()
  })
}

function decoded(res: http.IncomingMessage) {
  const enc = String(res.headers['content-encoding'] ?? '').toLowerCase()
  if (enc === 'gzip') return res.pipe(zlib.createGunzip())
  if (enc === 'deflate') return res.pipe(zlib.createInflate())
  if (enc === 'br') return res.pipe(zlib.createBrotliDecompress())
  return res
}

function readBody(res: http.IncomingMessage, type: string, o: Opts): Promise<Buffer> {
  const isHtml = /^text\/html|^application\/xhtml/.test(type)
  const limit = isHtml ? o.htmlBytes : o.maxBytes
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    const src = decoded(res)
    src.on('data', (c: Buffer) => {
      size += c.length
      if (size > limit) {
        if (isHtml) {
          chunks.push(c.subarray(0, c.length - (size - limit)))
          res.destroy()
          return resolve(Buffer.concat(chunks))
        }
        res.destroy()
        return reject(new FetchRefused('That file is too big.'))
      }
      chunks.push(c)
    })
    src.on('end', () => resolve(Buffer.concat(chunks)))
    src.on('error', () => reject(new FetchRefused('That address could not be read.')))
    res.on('error', () => reject(new FetchRefused('That address could not be read.')))
  })
}

/** A GET that only ever talks to public hosts, follows a few redirects, and caps time and size. */
export async function safeGet(input: string, o: Opts): Promise<Got> {
  let target = parseWebAddress(input)
  if ('error' in target) throw new FetchRefused(target.error)
  let url = target.url
  const deadline = Date.now() + o.timeoutMs * 2
  for (let hop = 0; hop < 4; hop++) {
    if (Date.now() > deadline) throw new FetchRefused('That site took too long to answer.')
    const host = url.hostname.replace(/^\[|\]$/g, '')
    if (net.isIP(host) && isPrivateAddress(host))
      throw new FetchRefused('Only public web addresses work.')
    const { res } = await once(url, o)
    const status = res.statusCode ?? 0
    if (status >= 300 && status < 400 && res.headers.location) {
      res.resume()
      target = parseWebAddress(new URL(res.headers.location, url).toString())
      if ('error' in target) throw new FetchRefused(target.error)
      url = target.url
      continue
    }
    if (status < 200 || status >= 300) {
      res.resume()
      throw new FetchRefused(`That address answered with an error (${status}).`)
    }
    const type = String(res.headers['content-type'] ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase()
    return { url, type, body: await readBody(res, type, o) }
  }
  throw new FetchRefused('That address redirects too many times.')
}
