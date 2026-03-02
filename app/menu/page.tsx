import { redirect } from 'next/navigation'

// Old menu page — redirected to new landing page planner
export default function MenuPage() {
  redirect('/')
}
