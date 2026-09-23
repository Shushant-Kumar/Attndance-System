export default function PlaceholderPage({ title = "Page", phase = "" }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">
          {title}
        </h1>

        <p className="mt-3 text-gray-500">
          This module is currently under development.
        </p>

        {phase && (
          <p className="mt-2 text-sm text-gray-400">
            {phase}
          </p>
        )}
      </div>
    </div>
  );
}