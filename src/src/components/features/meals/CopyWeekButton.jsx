/**
 * CopyWeekButton Component
 * Button to copy Next Week meals to This Week
 * Shows confirmation dialog before copying
 */

import { useState } from 'react';
import { Copy } from 'lucide-react';

export function CopyWeekButton({ onCopy, disabled }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    setIsCopying(true);
    await onCopy();
    setIsCopying(false);
    setShowConfirm(false);
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={disabled || isCopying}
        className="flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        style={{
          minHeight: '48px',
        }}
      >
        <Copy size={20} />
        Copy Next Week → This Week
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Confirm Copy</h3>
            <p className="text-gray-700 mb-6">
              This will copy all meals from Next Week to This Week, replacing any existing meals in This Week. Are you sure?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isCopying}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
                style={{ minHeight: '44px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCopy}
                disabled={isCopying}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
                style={{ minHeight: '44px' }}
              >
                {isCopying ? 'Copying...' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CopyWeekButton;
