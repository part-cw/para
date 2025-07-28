import { useNavigationState } from '@react-navigation/native';
import { useEffect } from 'react';

// For debugging expo router stack history. Taken from ChatGPT
export default function DebugStack() {
  const routes = useNavigationState(state => state.routes);
  const index = useNavigationState(state => state.index);

  useEffect(() => {
    console.log('Current Stack:');
    routes.forEach((route, i) => {
      console.log(`${i === index ? '👉' : '  '} [${i}] ${route.name}`, route.params);
    });
  }, [routes, index]);

  return null;
}
