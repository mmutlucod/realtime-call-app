import { useEffect } from 'react';
import { Slot, useRouter } from 'expo-router';
import { pushNotificationService } from '../src/services/push-notification.services';

export default function RootLayout() {
  const router = useRouter();
  
  useEffect(() => {
    const notificationListener = pushNotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('notification received:', notification);
      }
    );
    
    const responseListener = pushNotificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('notification tapped:', response);
        const data = response.notification.request.content.data;
        
        if (data.type === 'incoming-call') {
          router.replace('/lobby');
        }
      }
    );
    
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);
  
  return <Slot />;
}