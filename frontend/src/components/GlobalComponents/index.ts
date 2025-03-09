import { useNotifications, type CloseNotification, type ShowNotification } from '@toolpad/core';

interface NotificationsInstance {
  show: ShowNotification;
  close: CloseNotification;
}

let notifications: NotificationsInstance;
export default () => {
  notifications = useNotifications();
  return null;
};

export { notifications };
