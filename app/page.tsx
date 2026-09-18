import { LivelyApp } from '@/components/lively/lively-app'

// Firebase Web SDK configuration. These values are intended for client-side use.
const config = {
  apiKey: 'AIzaSyC20z6dWPD4Fjinc6KKpVDmm9rQUGeKjHU',
  authDomain: 'kartify-a4e66.firebaseapp.com',
  databaseURL: 'https://kartify-a4e66-default-rtdb.firebaseio.com',
  projectId: 'kartify-a4e66',
  storageBucket: 'kartify-a4e66.firebasestorage.app',
  messagingSenderId: '663778229564',
  appId: '1:663778229564:web:6c7c55b61dba8271913239',
}

export default function Page() {
  return <LivelyApp config={config} />
}
