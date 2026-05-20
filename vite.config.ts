import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ตั้งค่า Vite ให้ใช้ React ใน dev/build และเปิดใช้งาน React Compiler
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
})
