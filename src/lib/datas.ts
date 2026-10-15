// Datas são renderizadas no servidor (Server Components / Server Actions),
// cujo fuso não é o do usuário — a hospedagem roda em UTC ou no fuso do
// datacenter. Sem fixar o timeZone, um login às 9h aparecia com 3h+ de
// diferença. O escritório opera em horário de Brasília, então o fuso é fixo.
const FUSO = 'America/Sao_Paulo';

export function formatarDataHora(valor: string | Date): string {
  return new Date(valor).toLocaleString('pt-BR', { timeZone: FUSO });
}

export function formatarData(valor: string | Date): string {
  return new Date(valor).toLocaleDateString('pt-BR', { timeZone: FUSO });
}
