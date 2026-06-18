export default function NewspaperLayout({ data }) {
    return (
        <div>
            <h1>Layout Jornalístico</h1>
            <pre>Dados: {JSON.stringify(data)}</pre>
        </div>
    )
}