interface PaginationRelLinksProps {
  prevPath?: string;
  nextPath?: string;
}

/** Renders rel=prev/next link tags — hoisted to document head by Next.js App Router. */
export function PaginationRelLinks({ prevPath, nextPath }: PaginationRelLinksProps) {
  return (
    <>
      {prevPath ? <link rel="prev" href={prevPath} /> : null}
      {nextPath ? <link rel="next" href={nextPath} /> : null}
    </>
  );
}
