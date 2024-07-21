const ErrorResponse = (message: string, status: number) => {
  return {
    success: false,
    message,
    status,
  };
};

const SuccessResponse = (data: any, status: number) => {
  return {
    success: true,
    data,
    status,
  };
};

export { ErrorResponse, SuccessResponse };
