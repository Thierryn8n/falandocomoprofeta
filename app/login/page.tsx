import LoginPageClient from "./login-page-client"

export default async function Page(props: {
  params: Promise<Record<string, string | string[]>>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await props.params
  await props.searchParams
  return <LoginPageClient />
}
