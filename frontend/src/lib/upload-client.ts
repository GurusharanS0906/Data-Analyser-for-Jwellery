import type {
  CleanResponse,
  ConfirmUploadResponse,
  UploadAnalyzeResponse,
} from "@/types/upload";

interface UploadToken {
  token: string;
  apiUrl: string;
}

async function getUploadToken(): Promise<UploadToken> {
  const response = await fetch("/api/uploads/token");
  if (!response.ok) {
    throw new Error("Could not start upload session. Please log in again.");
  }
  return response.json();
}

async function parseErrorDetail(xhr: XMLHttpRequest, fallback: string): Promise<string> {
  try {
    const body = JSON.parse(xhr.responseText);
    return body.detail ?? fallback;
  } catch {
    return fallback;
  }
}

/** Uploads directly to the FastAPI backend so 100MB files aren't constrained
 * by a serverless proxy's request body limits — and so we get real
 * byte-level progress events for the progress bar. */
export function uploadFileWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<UploadAnalyzeResponse> {
  return new Promise((resolve, reject) => {
    getUploadToken()
      .then(({ token, apiUrl }) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${apiUrl}/api/v1/uploads`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(await parseErrorDetail(xhr, "Upload failed. Please try again.")));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload."));

        const formData = new FormData();
        formData.append("file", file);
        xhr.send(formData);
      })
      .catch(reject);
  });
}

async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { token, apiUrl } = await getUploadToken();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? "Request failed. Please try again.");
  }

  return response.json();
}

export function requestCleanPreview(fileId: string): Promise<CleanResponse> {
  return backendFetch<CleanResponse>(`/api/v1/uploads/${fileId}/clean`, {
    method: "POST",
  });
}

export function confirmUpload(
  fileId: string,
  applyCleaning: boolean
): Promise<ConfirmUploadResponse> {
  return backendFetch<ConfirmUploadResponse>(`/api/v1/uploads/${fileId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apply_cleaning: applyCleaning }),
  });
}
