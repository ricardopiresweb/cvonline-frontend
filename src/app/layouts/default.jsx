export default function DefaultLayout({ data }) {
    return (
        <div>
            <h1>Layout Padrão</h1>
            <pre>Dados: {JSON.stringify(data)}</pre>
        </div>
    )
}