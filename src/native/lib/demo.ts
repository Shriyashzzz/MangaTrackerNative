// The app's stand-in for the web's lib/demo.ts: the practice account is the
// website's alone for now, so the app is never in it
export const isDemo = () => false;
export const demoResponse = async (
  _path: string,
  _method?: string,
  _body?: string,
): Promise<Response> => {
  throw new Error("The practice account isn't in the app yet.");
};
