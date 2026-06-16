'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Textarea } from '@/components/ui'
import { slugify } from '@/lib/automation/utils'
import { BLOG_CATEGORIES, type BlogCategory } from '@/types/blog'

// ── Editor ⇄ API payload shape ────────────────────────────────
export interface PostFormValues {
  title: string
  slug: string
  description: string
  category: BlogCategory
  tags: string[]
  featuredImage: string
  readingTime?: number
  draft: boolean
  featured: boolean
  body: string // MDX content (no frontmatter)
  createdAt?: string // present on edit
}

interface PostEditorProps {
  mode: 'create' | 'edit'
  initial?: PostFormValues
}

// Field-level errors keyed by payload field name.
type FieldErrors = Partial<Record<string, string>>

interface SubmitState {
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string
}

const EMPTY_VALUES: PostFormValues = {
  title: '',
  slug: '',
  description: '',
  category: 'tutorials',
  tags: [],
  featuredImage: '',
  readingTime: undefined,
  draft: true,
  featured: false,
  body: '',
}

interface PostsApiResponse {
  slug?: string
  error?: string
  details?: Record<string, string>
}

interface UploadApiResponse {
  ok?: boolean
  path?: string
  error?: string
}

interface UploadState {
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string
  path: string
}

export function PostEditor({ mode, initial }: PostEditorProps) {
  const router = useRouter()
  const [values, setValues] = useState<PostFormValues>(initial ?? EMPTY_VALUES)
  const [tagsInput, setTagsInput] = useState<string>((initial?.tags ?? []).join(', '))
  const [slugTouched, setSlugTouched] = useState<boolean>(mode === 'edit')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle', message: '' })

  // Image uploader (additive — does not affect form submission).
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    message: '',
    path: '',
  })

  const isLoading = submitState.status === 'loading'
  const isCreate = mode === 'create'
  const isUploading = uploadState.status === 'loading'

  function clearFieldError(field: string) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  // ── Field updates ──────────────────────────────────────────────
  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    setValues((prev) => ({
      ...prev,
      title,
      // Auto-suggest slug only in create mode while the slug is untouched.
      slug: isCreate && !slugTouched ? slugify(title) : prev.slug,
    }))
    clearFieldError('title')
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true)
    setValues((prev) => ({ ...prev, slug: e.target.value }))
    clearFieldError('slug')
  }

  function handleDescriptionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValues((prev) => ({ ...prev, description: e.target.value }))
    clearFieldError('description')
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setValues((prev) => ({ ...prev, category: e.target.value as BlogCategory }))
    clearFieldError('category')
  }

  function handleTagsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setTagsInput(raw)
    setValues((prev) => ({
      ...prev,
      tags: raw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }))
    clearFieldError('tags')
  }

  function handleFeaturedImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, featuredImage: e.target.value }))
    clearFieldError('featuredImage')
  }

  // ── Image upload ───────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setUploadState({ status: 'idle', message: '', path: '' })
  }

  async function handleUpload() {
    if (!selectedFile) {
      setUploadState({ status: 'error', message: 'Choose a file first.', path: '' })
      return
    }

    setUploadState({ status: 'loading', message: '', path: '' })

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      // Derive a name hint from the file name (extension stripped server-side).
      const baseName = selectedFile.name.replace(/\.[^.]+$/, '')
      if (baseName) formData.append('name', baseName)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = (await res.json()) as UploadApiResponse

      if (res.ok && data.path) {
        const uploadedPath = data.path
        // Auto-fill the featured image only if it's currently empty.
        setValues((prev) =>
          prev.featuredImage.trim() === '' ? { ...prev, featuredImage: uploadedPath } : prev
        )
        setUploadState({ status: 'success', message: 'Image uploaded.', path: uploadedPath })
        return
      }

      setUploadState({
        status: 'error',
        message: data.error ?? 'Upload failed. Please try again.',
        path: '',
      })
    } catch (err) {
      setUploadState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Upload failed. Please try again.',
        path: '',
      })
    }
  }

  function handleReadingTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setValues((prev) => ({
      ...prev,
      readingTime: raw === '' ? undefined : Number(raw),
    }))
    clearFieldError('readingTime')
  }

  function handleDraftChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, draft: e.target.checked }))
  }

  function handleFeaturedChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, featured: e.target.checked }))
  }

  function handleBodyChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValues((prev) => ({ ...prev, body: e.target.value }))
    clearFieldError('body')
  }

  // ── Submit ─────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    setSubmitState({ status: 'loading', message: '' })

    try {
      const res = await fetch('/api/admin/posts', {
        method: isCreate ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = (await res.json()) as PostsApiResponse

      if (res.ok) {
        setSubmitState({
          status: 'success',
          message: isCreate ? 'Post created.' : 'Post updated.',
        })
        if (isCreate) {
          router.push('/admin')
        }
        return
      }

      if (res.status === 400 && data.details) {
        setFieldErrors(data.details)
        setSubmitState({
          status: 'error',
          message: 'Please fix the highlighted fields.',
        })
        return
      }

      if (res.status === 409) {
        setFieldErrors((prev) => ({
          ...prev,
          slug: 'A post with that slug already exists.',
        }))
        setSubmitState({
          status: 'error',
          message: 'A post with that slug already exists.',
        })
        return
      }

      setSubmitState({
        status: 'error',
        message: data.error ?? 'Something went wrong. Please try again.',
      })
    } catch (err) {
      setSubmitState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    }
  }

  const checkboxClass =
    'h-4 w-4 rounded border-ds-border bg-ds-surface2 text-ds-accent accent-ds-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ds-bg disabled:opacity-50'

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Post editor"
      className="flex flex-col gap-5"
    >
      {/* Status banner */}
      {submitState.status === 'error' && (
        <div
          role="alert"
          aria-live="assertive"
          className="border-ds-error/30 bg-ds-error/10 text-ds-error rounded-lg border px-4 py-3 text-sm"
        >
          {submitState.message}
        </div>
      )}
      {submitState.status === 'success' && (
        <div
          role="status"
          aria-live="polite"
          className="border-ds-success/30 bg-ds-success/10 text-ds-success rounded-lg border px-4 py-3 text-sm"
        >
          {submitState.message}
        </div>
      )}

      <Input
        label="Title"
        name="title"
        type="text"
        value={values.title}
        onChange={handleTitleChange}
        error={fieldErrors.title}
        disabled={isLoading}
        required
        placeholder="How I automated my blog pipeline"
      />

      <Input
        label="Slug"
        name="slug"
        type="text"
        value={values.slug}
        onChange={handleSlugChange}
        error={fieldErrors.slug}
        disabled={isLoading || !isCreate}
        required
        hint={
          isCreate
            ? 'Auto-suggested from the title. kebab-case (a-z, 0-9, hyphens).'
            : 'The slug is the filename key and cannot be changed when editing.'
        }
        placeholder="how-i-automated-my-blog-pipeline"
      />

      <Textarea
        label="Description"
        name="description"
        rows={3}
        value={values.description}
        onChange={handleDescriptionChange}
        error={fieldErrors.description}
        disabled={isLoading}
        required
        hint="130–160 characters, unique and human-readable."
        placeholder="A short, unique summary of this post."
      />

      {/* Category — native select styled with ds tokens */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="post-category" className="text-ds-text text-[13px] font-medium">
          Category
          <span className="text-ds-error ml-1" aria-hidden="true">
            *
          </span>
        </label>
        <select
          id="post-category"
          name="category"
          value={values.category}
          onChange={handleCategoryChange}
          disabled={isLoading}
          className="bg-ds-surface2 text-ds-text border-ds-border focus:border-ds-accent h-11 w-full rounded-lg border px-4 text-[14px] transition-colors duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {BLOG_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {fieldErrors.category && (
          <p className="text-ds-error text-[12px]" role="alert">
            {fieldErrors.category}
          </p>
        )}
      </div>

      <Input
        label="Tags"
        name="tags"
        type="text"
        value={tagsInput}
        onChange={handleTagsChange}
        error={fieldErrors.tags}
        disabled={isLoading}
        hint="Comma-separated, 2–5 tags (e.g. automation, ci-cd, mdx)."
        placeholder="automation, ci-cd, mdx"
      />

      {/* Image uploader (local-only) */}
      <div className="border-ds-border bg-ds-surface2 flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex flex-col gap-1">
          <span className="text-ds-text text-[13px] font-medium">Upload image</span>
          <span className="text-ds-muted text-[12px]">
            Saves to <code className="font-mono">public/images/blog/</code>. Max 5MB — webp, png,
            jpg, gif, svg.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            aria-label="Choose an image to upload"
            className="text-ds-muted file:bg-ds-surface file:text-ds-text file:border-ds-border hover:file:border-ds-accent text-[13px] file:mr-3 file:cursor-pointer file:rounded-md file:border file:px-3 file:py-1.5 file:text-[13px] file:transition-colors disabled:opacity-50"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUpload}
            loading={isUploading}
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? 'Uploading…' : 'Upload image'}
          </Button>
        </div>

        {uploadState.status === 'error' && (
          <p role="alert" className="text-ds-error text-[12px]">
            {uploadState.message}
          </p>
        )}

        {uploadState.status === 'success' && (
          <div role="status" aria-live="polite" className="flex flex-col gap-1">
            <p className="text-ds-success text-[12px]">{uploadState.message}</p>
            <code className="text-ds-text bg-ds-surface border-ds-border block rounded-md border px-3 py-2 font-mono text-[12px] break-all">
              {uploadState.path}
            </code>
            <p className="text-ds-muted text-[12px]">
              Paste into the MDX body as{' '}
              <code className="font-mono">![alt]({uploadState.path})</code>
            </p>
          </div>
        )}
      </div>

      <Input
        label="Featured image"
        name="featuredImage"
        type="text"
        value={values.featuredImage}
        onChange={handleFeaturedImageChange}
        error={fieldErrors.featuredImage}
        disabled={isLoading}
        hint="Public path, e.g. /images/blog/my-post.webp"
        placeholder="/images/blog/my-post.webp"
      />

      <Input
        label="Reading time (minutes)"
        name="readingTime"
        type="number"
        min={1}
        value={values.readingTime ?? ''}
        onChange={handleReadingTimeChange}
        error={fieldErrors.readingTime}
        disabled={isLoading}
        hint="Optional — computed from the body word count if left blank."
        placeholder="7"
      />

      {/* Flags */}
      <div className="flex flex-wrap gap-6">
        <label className="text-ds-text flex items-center gap-2 text-[14px]">
          <input
            type="checkbox"
            name="draft"
            checked={values.draft}
            onChange={handleDraftChange}
            disabled={isLoading}
            className={checkboxClass}
          />
          Draft
        </label>
        <label className="text-ds-text flex items-center gap-2 text-[14px]">
          <input
            type="checkbox"
            name="featured"
            checked={values.featured}
            onChange={handleFeaturedChange}
            disabled={isLoading}
            className={checkboxClass}
          />
          Featured
        </label>
      </div>

      <Textarea
        label="Body (MDX)"
        name="body"
        rows={18}
        value={values.body}
        onChange={handleBodyChange}
        error={fieldErrors.body}
        disabled={isLoading}
        required
        className="font-mono text-[13px]"
        placeholder={'## Introduction\n\nWrite your MDX content here…'}
      />

      <Button
        type="submit"
        size="lg"
        loading={isLoading}
        disabled={isLoading}
        className="self-start"
      >
        {isLoading
          ? isCreate
            ? 'Creating…'
            : 'Saving…'
          : isCreate
            ? 'Create post'
            : 'Save changes'}
      </Button>
    </form>
  )
}
