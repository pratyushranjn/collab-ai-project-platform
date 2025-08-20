export const safeRequest = async (promiseFn) => {
  try {
    const data = await promiseFn();
    return [data, null];
  } catch (error) {
    const errMsg = error?.response?.data?.error || error.message || 'Something went wrong';
    return [null, errMsg];
  }
};
