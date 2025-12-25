import { Expo, ExpoPushMessage } from 'expo-server-sdk';

class PushNotificationService {
  private expo: Expo;
  
  constructor() {
    this.expo = new Expo({
      useFcmV1: true,
    });
  }
  
  async sendCallNotification(pushToken: string, callerName: string, callType: 'video' | 'audio') {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`❌ Invalid push token: ${pushToken}`);
      return;
    }
    
    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title: 'Incoming Call 📞',
      body: `${callerName} is ${callType === 'video' ? 'video' : 'audio'} calling you`,
      data: { 
        type: 'incoming-call',
        callerName,
        callType 
      },
      priority: 'high',
      channelId: 'incoming-calls',
    };
    
    try {
      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets = [];
      
      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }
      tickets.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          console.error(`❌ Notification error ${index}:`, ticket.message, ticket.details);
        }
      });
      
    } catch (error) {
      console.error('❌ Push notification error:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();