export default function PromisePool(
  arr: any[], // array of items to be iterated
  worker: (item: any, index: number) => Promise<any>,
  concurrency: number,
  options: {
    stopOnErr?: boolean
  },
): Promise<any[]>
