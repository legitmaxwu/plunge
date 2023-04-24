import { toast } from "react-hot-toast";

export function handleError(err: any) {
  console.error(err);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  toast.error(err.message ?? "Something went wrong.");
}
