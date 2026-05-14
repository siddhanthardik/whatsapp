import React from 'react'

export default function PageHeader({ title }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  )
}
