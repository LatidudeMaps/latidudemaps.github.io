import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Michele Tricarico
        </h1>
        <h2 className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-6">
          Geologist & GIS Specialist
        </h2>
        <p className="text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-300 mb-8">
          Specializing in geological modeling, environmental monitoring, and advanced GIS systems. 
          Bringing together technical expertise with creativity and precision.
        </p>
      </div>

      {/* Social Links */}
      <div className="flex space-x-6 mb-12">
        <a
          href="https://github.com/latidudemaps"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 dark:text-gray-400 hover:text-blue-500"
        >
          GitHub
        </a>
        <a
          href="mailto:latidude.maps@gmail.com"
          className="text-gray-600 dark:text-gray-400 hover:text-blue-500"
        >
          Email
        </a>
      </div>

      {/* CTA Buttons */}
      <div className="flex space-x-4">
        <Link
          href="/portfolio"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          View My Work
        </Link>
        <Link
          href="/contact"
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Get in Touch
        </Link>
      </div>
    </div>
  )
}