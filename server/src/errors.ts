/** Lỗi có mã HTTP rõ ràng; error handler trả thẳng `message` cho client. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}
