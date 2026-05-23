export class ApiResponse<T = unknown> {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly data: T | null = null,
  ) {}

  static ok        = <T>(data: T, msg = 'Success') => new ApiResponse(true, msg, data);
  static created   = <T>(data: T, msg = 'Created') => new ApiResponse(true, msg, data);
  static noContent = (msg = 'Deleted')              => new ApiResponse(true, msg, null);
}
