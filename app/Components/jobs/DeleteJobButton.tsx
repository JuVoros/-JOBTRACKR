'use client'

import { deleteJob } from '../../actions/jobs'

export default function DeleteJobButton({ id }: { id: string }) {
  const deleteJobWithId = deleteJob.bind(null, id)

  return (
    <form action={deleteJobWithId}>
      <button
        type="submit"
        className="text-sm text-rose-700/80 underline-offset-2 transition-colors hover:text-rose-900 hover:underline"
        onClick={(e) => {
          if (!confirm('Delete this application?')) e.preventDefault()
        }}
      >
        Delete
      </button>
    </form>
  )
}
