//src/app/ai/components/dashboard/SuccessNotification.tsx
import { SuccessState } from './types'

type SuccessNotificationProps = {
  success: SuccessState
}

export function SuccessNotification({ success }: SuccessNotificationProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-green-900/50 border border-green-800/50 rounded-lg p-4 text-green-200">
      <h3 className="font-semibold mb-2">Tool Successfully Created!</h3>
      <ul className="list-disc list-inside space-y-1">
        <li>Name: {success.name}</li>
        <li>Category: {success.category}</li>
        <li>Suite: {success.suite}</li>
      </ul>
    </div>
  )
}