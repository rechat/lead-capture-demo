import { LeadCaptureForm } from "@/components/lead-capture-form"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 flex items-center justify-center p-4">
        <LeadCaptureForm />
      </main>
      <footer className="py-4 text-center text-sm text-gray-600 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <a
            href="/api/spec"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            API Documentation (OpenAPI Specification)
          </a>
        </div>
      </footer>
    </div>
  )
}
