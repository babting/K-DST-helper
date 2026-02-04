import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 저장소 이름인 /jarayo/를 설정합니다.
  base: '/K-DST-helper/', 
  plugins: [react()],
})