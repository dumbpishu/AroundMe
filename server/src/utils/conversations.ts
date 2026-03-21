export const getConversationId = (userA: string, userB: string) => {
  return [userA, userB].sort().join("_");
};