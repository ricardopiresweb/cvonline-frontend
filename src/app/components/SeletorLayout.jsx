"use client";

import { useRouter, useParams } from "next/navigation";

export default function SeletorLayout() {
    const router = useRouter();
    const params = useParams();

    const layoutAtual = params.layout?.[0] || "default";

    const handleChange = (e) => {
        const layoutSelecionado = e.target.value

        router.push(`/user/${params.userId}/${layoutSelecionado}`)
    }

    return (
        <div style={{ marginBottom: '20px' }}>
            <label style={{ marginRight: '10px' }}>Alterar Estilo:</label>
            <select
                value={layoutAtual}
                onChange={handleChange}
                style={{ padding: '5px', borderRadius: '4px' }}
            >
                <option value="default">Padrão</option>
                <option value="rpg">RPG</option>
                <option value="newspaper">Jornal</option>
            </select>
        </div>
    );
}