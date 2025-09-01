export default function ContactPage() {
    return (
      <main className="max-w-2xl mx-auto py-20 px-6">
        <h1 className="text-3xl font-bold mb-6">Contact</h1>
        <p className="mb-4">
          Feel free to reach out to me via email or connect on social platforms:
        </p>
        <ul className="space-y-2">
          <li>Email: <a href="mailto:you@example.com" className="text-blue-600 underline">you@example.com</a></li>
          <li>LinkedIn: <a href="https://linkedin.com/in/yourname" className="text-blue-600 underline">linkedin.com/in/yourname</a></li>
          <li>GitHub: <a href="https://github.com/yourusername" className="text-blue-600 underline">github.com/yourusername</a></li>
        </ul>
      </main>
    );
  }
  