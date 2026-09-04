import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // เช็ค status ครั้งแรก
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? true);
      setIsChecking(false);
    });

    // subscribe การเปลี่ยนแปลง
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline, isChecking };
}
