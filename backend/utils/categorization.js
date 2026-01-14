function removerAcentos(texto) {
    if (!texto) return '';
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function obterCategoria(descricao) {
    if (!descricao) return 'Outros';
    
    const desc = removerAcentos(descricao);
    
    // Alimentação
    if (/mercado|alimento|comida|restaurante|lanche|ifood|supermercado|feira|padaria|acougue|hortifruti|padaria/.test(desc)) {
        return 'Alimentacao';
    }
    
    // Transporte
    if (/gasolina|combustivel|uber|taxi|onibus|metro|transporte|moto|carro|estacionamento|posto|manutencao|seguro|ipva/.test(desc)) {
        return 'Transporte';
    }
    
    // Lazer
    if (/netflix|spotify|cinema|shopping|lazer|academia|jogo|festa|bar|show|viagem|hotel|passagem/.test(desc)) {
        return 'Lazer';
    }
    
    // Saúde
    if (/farmacia|remedio|medico|saude|plano|hospital|consulta|exame|dentista|oculos/.test(desc)) {
        return 'Saude';
    }
    
    // Contas
    if (/telefone|celular|internet|conta|agua|luz|energia|condominio|aluguel|financiamento|emprestimo/.test(desc)) {
        return 'Contas';
    }
    
    // Educação
    if (/curso|faculdade|livro|material|escola|universidade|aula/.test(desc)) {
        return 'Educacao';
    }
    
    // Vestuário
    if (/roupa|tenis|sapato|camisa|calca|loja|moda|vestuario/.test(desc)) {
        return 'Vestuario';
    }
    
    // Serviços
    if (/servico|conserto|manutencao|reparo|tecnico|assistencia/.test(desc)) {
        return 'Servicos';
    }
    
    return 'Outros';
}

function detectarFormaPagamento(texto) {
    if (!texto) return 'outro';
    
    const desc = removerAcentos(texto);
    
    if (/(^|\s)pix(\s|$)/.test(desc)) return 'pix';
    if (/(^|\s)dinheiro(\s|$)/.test(desc)) return 'dinheiro';
    if (/(^|\s)credito(\s|$)/.test(desc)) return 'credito';
    if (/(^|\s)debito(\s|$)/.test(desc)) return 'debito';
    if (/(^|\s)cartao(\s|$)/.test(desc)) return 'credito';
    if (/(^|\s)transferencia|ted(\s|$)/.test(desc)) return 'pix';
    
    return 'outro';
}

function extrairFormaPagamentoEData(texto) {
    if (!texto) return { formaPagamento: 'outro', data: new Date(), descricao: '' };
    
    let formaPagamento = 'outro';
    let data = new Date();
    let descricao = texto.trim();
    
    const palavras = descricao.split(' ');
    const novasPalavras = [];
    
    // Padrões de data
    const padroesData = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
        /(\d{1,2})\/(\d{1,2})/,           // DD/MM
        /hoje/,
        /ontem/,
        /amanha/
    ];
    
    // Verificar cada palavra
    for (let i = palavras.length - 1; i >= 0; i--) {
        const palavra = palavras[i].toLowerCase();
        let removida = false;
        
        // Verificar se é forma de pagamento
        const forma = detectarFormaPagamento(palavra);
        if (forma !== 'outro' && formaPagamento === 'outro') {
            formaPagamento = forma;
            removida = true;
        }
        
        // Verificar se é data
        for (const padrao of padroesData) {
            if (padrao.test(palavra) && !removida) {
                // Lógica de parse de data (simplificada)
                if (palavra === 'hoje') {
                    data = new Date();
                } else if (palavra === 'ontem') {
                    data = new Date();
                    data.setDate(data.getDate() - 1);
                } else {
                    // Parse simples de data
                    const match = palavra.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
                    if (match) {
                        const dia = parseInt(match[1]);
                        const mes = parseInt(match[2]) - 1;
                        const ano = match[3] ? parseInt(match[3]) : new Date().getFullYear();
                        data = new Date(ano, mes, dia);
                    }
                }
                removida = true;
                break;
            }
        }
        
        if (!removida) {
            novasPalavras.unshift(palavras[i]);
        }
    }
    
    return {
        formaPagamento,
        data,
        descricao: novasPalavras.join(' ').trim()
    };
}

function formatarData(data) {
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarFormaPagamento(forma) {
    const formatos = {
        'pix': '📱 PIX',
        'dinheiro': '💵 Dinheiro',
        'credito': '💳 Crédito',
        'debito': '🏦 Débito',
        'outro': '📄 Outro'
    };
    return formatos[forma] || forma;
}

function obterIconeCategoria(categoria) {
    const icones = {
        'Alimentacao': '🍔',
        'Transporte': '🚗',
        'Lazer': '🎬',
        'Saude': '🏥',
        'Contas': '💡',
        'Educacao': '📚',
        'Vestuario': '👕',
        'Servicos': '🔧',
        'Outros': '📦'
    };
    return icones[categoria] || '📌';
}

module.exports = {
    removerAcentos,
    obterCategoria,
    detectarFormaPagamento,
    extrairFormaPagamentoEData,
    formatarData,
    formatarMoeda,
    formatarFormaPagamento,
    obterIconeCategoria
};