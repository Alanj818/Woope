export const formatTimeAgo = (createdAt: string): string => {
  const now = new Date();
  const postDate = new Date(createdAt);
  const diffMs = now.getTime() - postDate.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHrs < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins <= 1 ? '1 min ago' : `${diffMins} min ago`;
  }

  if (diffHrs < 24) {
    return diffHrs === 1 ? '1 hr ago' : `${diffHrs} hr ago`;
  }

  if (diffDays <= 6) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }

  // After 6 days, show the actual date
  return postDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};
