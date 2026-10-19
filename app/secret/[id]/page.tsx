'use client';
import { useState } from 'react';
import CryptoJS from 'crypto-js';
import { use } from 'react';

export default function SecretPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [decryptedSecret, setDecryptedSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Only fetch when the reader clicks, so link previews, prefetches and
  // React's double-run of effects in dev can't burn the secret first
  const fetchAndDecrypt = async () => {
    setLoading(true);
    setError('');
    try {
      const key = window.location.hash.substring(1);
      if (!key) throw new Error("No decryption key found in the URL.");

      const response = await fetch(`/api/secret?id=${resolvedParams.id}`, { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to retrieve secret.");

      const bytes = CryptoJS.AES.decrypt(data.encryptedText, key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);

      if (!originalText) throw new Error("Decryption failed. Corrupted data.");

      setDecryptedSecret(originalText);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-900 text-white">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-green-400">Secret Message</h1>

        {!decryptedSecret && !error && (
          <div>
            <p className="text-sm mb-4 text-gray-400">This secret can only be viewed once. It is deleted as soon as you reveal it.</p>
            <button
              onClick={fetchAndDecrypt}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Fetching and decrypting...' : 'Reveal secret'}
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
            {error}
          </div>
        )}

        {decryptedSecret && (
          <div>
            <p className="text-sm mb-4 text-red-400 font-bold">This message is permanently deleted from the database. Save it now.</p>
            <textarea
              className="w-full p-3 bg-gray-700 rounded focus:outline-none text-white"
              rows={6}
              readOnly
              value={decryptedSecret}
            />
          </div>
        )}
      </div>
    </main>
  );
}

