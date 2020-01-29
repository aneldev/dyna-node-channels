export const validateChannelName = (channel: string): string => {
  if (channel.indexOf('@') > -1) return 'Channel name cannot have the "@" character';
  if (channel.indexOf(' ') > -1) return 'Channel name cannot have spaces';
  return '';
};
