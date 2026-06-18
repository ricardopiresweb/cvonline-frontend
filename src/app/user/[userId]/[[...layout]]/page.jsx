import DefaultLayout from '@/app/layouts/default'
import RpgLayout from '@/app/layouts/rpg'
import NewspaperLayout from '@/app/layouts/newspaper'
import SeletorLayout from '@/app/components/SeletorLayout'

export default async function Page({ params }) {
    const layouts = {
        default: DefaultLayout,
        rpg: RpgLayout,
        newspaper: NewspaperLayout
    }

    const { userId, layout } = await params
    const Template = layouts[layout] || DefaultLayout

    const apiUrl = `${process.env.API_HOST}/user/${userId}/`

    const res = await fetch(apiUrl)

    if (res.status !== 200) {
        return (<div>{res.statusText}</div>)
    }

    const user = await res.json()

    return (
        <div>
            <SeletorLayout />
            <Template data={user} />
        </div>
    )
}