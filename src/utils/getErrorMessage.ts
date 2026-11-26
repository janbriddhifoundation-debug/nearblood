export function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            error?: string;
            message?: string;
          };
        };
        message?: string;
      }
    ).response;

    const message = (
      error as {
        message?: string;
      }
    ).message;

    return (
      response?.data?.error ||
      response?.data?.message ||
      message ||
      "Something went wrong"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}
