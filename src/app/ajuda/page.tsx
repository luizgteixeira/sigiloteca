import Image from 'next/image';
import Link from 'next/link';
import { RETENTION_BASIS_OPTIONS } from '@/lib/retention';
import { VoltarAoTopo } from '@/components/voltar-ao-topo';

// Ajuda só para os pontos que costumam travar — não é um manual do site
// inteiro (esse é o manual em PDF). Página pública: parte das dúvidas
// (senha esquecida, celular do 2FA perdido) acontece antes do login.

const TEMAS = [
  { id: 'dois-fatores', titulo: 'Verificação em duas etapas (2FA)' },
  { id: 'senha', titulo: 'Senha' },
  { id: 'retencao', titulo: 'Retenção, legal hold, anonimização e exclusão' },
  { id: 'oficios', titulo: 'Modelo padrão de Ofícios' },
  { id: 'titulares', titulo: 'Solicitações de titulares (LGPD)' },
  { id: 'exportar', titulo: 'Exportar tudo' },
  { id: 'equipe', titulo: 'Equipe e papéis' },
  { id: 'auditoria', titulo: 'Auditoria' },
];

function Tema({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-lg border border-line bg-surface p-6"
    >
      <h2 className="font-display text-lg font-semibold text-ink">{titulo}</h2>
      <div className="mt-3 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Pergunta({
  pergunta,
  children,
}: {
  pergunta: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-body text-sm font-semibold text-ink">{pergunta}</h3>
      <div className="mt-1 flex flex-col gap-2 font-body text-sm text-ink-muted">
        {children}
      </div>
    </div>
  );
}

export default function AjudaPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header
        id="topo"
        tabIndex={-1}
        className="flex items-center justify-between border-b border-line pb-5 outline-none"
      >
        <div className="flex items-center gap-3">
          <Image
            src="/sigiloteca-icon.svg"
            alt=""
            width={40}
            height={40}
            priority
          />
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">
              Ajuda
            </h1>
            <p className="font-body text-sm text-ink-muted">
              Respostas para as dúvidas mais difíceis · Sigiloteca
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap rounded-md border border-line bg-surface px-3 py-2 font-body text-sm text-ink shadow-sm transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
        >
          ← Voltar
        </Link>
      </header>

      <nav aria-label="Temas da ajuda">
        <ul className="flex flex-wrap gap-2">
          {TEMAS.map((tema) => (
            <li key={tema.id}>
              <a
                href={`#${tema.id}`}
                className="inline-block rounded-md border border-line px-3 py-1.5 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {tema.titulo}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Tema id="dois-fatores" titulo="Verificação em duas etapas (2FA)">
        <Pergunta pergunta="Como ativo o 2FA no Google Authenticator?">
          <p>
            Em <strong>Minha conta</strong>, clique em &ldquo;Ativar
            autenticação de dois fatores&rdquo;. No celular, abra o Google
            Authenticator, toque em <strong>+</strong> e em &ldquo;Ler código
            QR&rdquo;. Depois digite no Sigiloteca o código de 6 dígitos que
            aparecer no app e clique em Confirmar.
          </p>
          <p>
            Se a câmera não funcionar, use &ldquo;Inserir chave de
            configuração&rdquo; no app e copie a chave manual mostrada abaixo
            do QR code.
          </p>
        </Pergunta>
        <Pergunta pergunta="Por que não consigo ver o QR code de novo?">
          <p>
            Por segurança, ele só aparece no momento da ativação. Se você não
            tem mais a entrada do Sigiloteca no app autenticador, siga a
            próxima pergunta.
          </p>
        </Pergunta>
        <Pergunta pergunta="Troquei ou perdi o celular. Como entro?">
          <p>
            Sem o app autenticador não é possível gerar o código, e o
            Sigiloteca não tem uma forma automática de pular essa etapa — é
            ela que protege sua conta se alguém descobrir sua senha. Fale com
            o responsável técnico do Sigiloteca: ele confirma que é você e
            remove o 2FA da conta. Depois de entrar, ative de novo em Minha
            conta, já no celular novo.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              E-mail:{' '}
              <a
                href="mailto:contato@luizgustavodev.com?subject=Sigiloteca%20-%20perdi%20o%20acesso%20ao%202FA"
                className="text-accent underline"
              >
                contato@luizgustavodev.com
              </a>
            </li>
            <li>
              WhatsApp:{' '}
              <a
                href="https://wa.me/5531992609970"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                (31) 9 9260-9970
              </a>
            </li>
          </ul>
        </Pergunta>
        <Pergunta pergunta="O código sempre dá &ldquo;inválido&rdquo;.">
          <p>
            Confira se está usando a entrada do <strong>Sigiloteca</strong> no
            app (e não a de outro serviço) e digite um código novo, logo que
            ele aparecer — cada um vale 30 segundos. Se continuar falhando,
            ative a data e hora <strong>automáticas</strong> no celular: o
            código depende do relógio estar certo.
          </p>
        </Pergunta>
      </Tema>

      <Tema id="senha" titulo="Senha">
        <Pergunta pergunta="Minha senha cumpre todos os requisitos, mas foi recusada. Por quê?">
          <p>
            O Sigiloteca recusa senhas que já apareceram em vazamentos de dados
            de outros sites, mesmo que cumpram os requisitos — por exemplo,
            nome seguido de @ e ano de nascimento. Essas são as primeiras que
            um invasor tenta. Isso não quer dizer que a <em>sua</em> conta
            vazou.
          </p>
          <p>
            Prefira três ou quatro palavras sem relação entre si, com número e
            símbolo (algo como <code>Caneta!Morro7Azulejo</code>), ou a senha
            forte sugerida pelo navegador.
          </p>
        </Pergunta>
        <Pergunta pergunta="Por que não consigo colar no campo &ldquo;Confirmar nova senha&rdquo;?">
          <p>
            A confirmação existe para pegar erros de digitação. Se você colar
            o que digitou no primeiro campo, um erro passaria despercebido e
            você ficaria sem conseguir entrar. Por isso a senha precisa ser
            digitada de novo.
          </p>
        </Pergunta>
        <Pergunta pergunta="Esqueci a senha. Como faço?">
          <p>
            Na tela de login, clique em &ldquo;Esqueceu sua senha?&rdquo; e
            informe seu e-mail. Chega um link (confira também o spam) que vale
            por tempo limitado e só pode ser usado uma vez. Se sua conta tem
            2FA, o código do app será pedido antes da nova senha.
          </p>
          <p>
            Se aparecer &ldquo;link inválido, já usado ou expirado&rdquo;, é só
            pedir um novo link.
          </p>
        </Pergunta>
        <Pergunta pergunta="Minha conta foi bloqueada depois de errar a senha.">
          <p>
            Depois de 5 senhas erradas em 15 minutos, a conta fica bloqueada
            por 15 minutos — a tela mostra quanto falta. Espere esse tempo ou
            use &ldquo;Esqueceu sua senha?&rdquo;.
          </p>
        </Pergunta>
      </Tema>

      <Tema
        id="retencao"
        titulo="Retenção, legal hold, anonimização e exclusão"
      >
        <Pergunta pergunta="Qual a diferença entre as quatro?">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Retenção:</strong> o documento precisa ser guardado até
              uma data. Até lá, não pode ser excluído, anonimizado nem ter o
              arquivo alterado.
            </li>
            <li>
              <strong>Legal hold (preservação especial):</strong> o mesmo
              bloqueio, mas sem data para acabar — para documentos ligados a
              processo, disputa ou investigação em curso.
            </li>
            <li>
              <strong>Anonimização:</strong> apaga o arquivo e o histórico de
              versões, e limpa cliente, processo, área e tags. Fica só o
              registro de que o documento existiu, sem dados pessoais.
            </li>
            <li>
              <strong>Exclusão:</strong> remove o documento por completo.
            </li>
          </ul>
          <p>
            Anonimização e exclusão são <strong>irreversíveis</strong>. Por
            isso ficam separadas, no botão &ldquo;Mais ações&rdquo; de cada
            documento, e só são confirmadas depois de digitar o título do
            documento.
          </p>
        </Pergunta>
        <Pergunta pergunta="Por que preciso escolher um fundamento ao definir uma data de retenção?">
          <p>
            A lei exige um motivo para guardar dados pessoais além do
            necessário, e o sistema não presume qual é — quem decide é o
            escritório. As opções são:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {RETENTION_BASIS_OPTIONS.map((opcao) => (
              <li key={opcao.value}>{opcao.label}</li>
            ))}
          </ul>
        </Pergunta>
        <Pergunta pergunta="Não consigo excluir um documento. Por quê?">
          <p>
            Ele está com retenção até uma data futura ou em legal hold — a
            mensagem na tela diz qual dos dois. O bloqueio vale no banco de
            dados, não só na tela, e não há como contorná-lo pelo sistema. Os
            dados do documento (título, categoria, cliente, processo, área e
            tags) continuam editáveis pelo botão &ldquo;Editar&rdquo;.
          </p>
          <p>
            Hoje a retenção e o legal hold são definidos no envio do documento
            e não aparecem na tela &ldquo;Editar&rdquo;.
          </p>
        </Pergunta>
        <Pergunta pergunta="Quando anonimizar em vez de excluir?">
          <p>
            Anonimize quando o escritório precisa manter o registro de que
            aquele documento existiu (por exemplo, para estatística ou
            histórico de atuação), mas não precisa mais dos dados pessoais.
            Exclua quando nem o registro é necessário. Em caso de dúvida,
            consulte o responsável jurídico do escritório antes.
          </p>
        </Pergunta>
      </Tema>

      <Tema id="oficios" titulo="Modelo padrão de Ofícios">
        <Pergunta pergunta="O que é o modelo padrão de Ofícios?">
          <p>
            É o documento-base de onde nascem todos os Ofícios do escritório.
            Em &ldquo;Novo Ofício&rdquo;, o Sigiloteca faz uma cópia do modelo
            e abre um editor na tela para preencher os campos marcados{' '}
            <code>[entre colchetes]</code> — o contador mostra quantos ainda
            faltam. O modelo em si nunca é alterado.
          </p>
        </Pergunta>
        <Pergunta pergunta="Quando marco &ldquo;Marcar como modelo padrão de Ofícios&rdquo;?">
          <p>
            Só ao enviar o documento que vai servir de base, na categoria
            Ofícios — em outras categorias a opção fica desabilitada. Para um
            Ofício comum, já preenchido, deixe desmarcado.
          </p>
          <p>
            O modelo pode ter, no fim, depois de uma linha com{' '}
            <code>---</code>, orientações de preenchimento. Essa parte não vai
            para os Ofícios criados a partir dele.
          </p>
        </Pergunta>
        <Pergunta pergunta="Posso ter mais de um modelo padrão?">
          <p>
            Não: o escritório tem um único modelo padrão de Ofícios. Para
            trocar, exclua o modelo atual e envie o novo com a opção marcada.
            Se o modelo atual estiver com retenção ou legal hold, ele não pode
            ser excluído antes do prazo.
          </p>
        </Pergunta>
        <Pergunta pergunta="Por que não consigo editar o modelo na tela?">
          <p>
            O editor de Ofícios serve para preencher cópias, não o modelo —
            assim ninguém altera a base sem querer. Os dados do modelo (título,
            tags etc.) podem ser alterados normalmente pelo botão
            &ldquo;Editar&rdquo;; só a categoria fica fixa em Ofícios.
          </p>
        </Pergunta>
      </Tema>

      <Tema id="titulares" titulo="Solicitações de titulares (LGPD)">
        <Pergunta pergunta="O que é uma solicitação de titular?">
          <p>
            Qualquer pessoa cujos dados o escritório trata (clientes,
            ex-clientes, partes, testemunhas) pode pedir para saber quais
            dados o escritório tem, corrigir, eliminar ou receber esses dados
            (LGPD, art. 18). O pedido é feito pelo formulário público{' '}
            <Link href="/titulares" className="text-accent underline">
              sigiloteca.com.br/titulares
            </Link>{' '}
            e aparece no menu <strong>Titulares</strong>.
          </p>
        </Pergunta>
        <Pergunta pergunta="O que faço quando chega um pedido?">
          <p>
            O Sigiloteca só registra e organiza: a análise e a resposta são
            feitas pelo escritório, por e-mail, direto com a pessoa. Depois de
            responder, clique em &ldquo;Marcar como concluída&rdquo;.
          </p>
          <p>
            Não confirme nem envie dados sem ter certeza de que quem pediu é
            mesmo o titular — confira por um canal que o escritório já
            conhece (telefone ou e-mail do cadastro, por exemplo).
          </p>
        </Pergunta>
        <Pergunta pergunta="Qual o prazo para responder?">
          <p>
            Para a declaração completa sobre os dados da pessoa (confirmação
            de tratamento ou acesso), o prazo é de até{' '}
            <strong>15 dias</strong> a partir do pedido (LGPD, art. 19, II).
            Para os demais pedidos, responda o quanto antes. O escritório
            recebe um e-mail de aviso a cada pedido novo, mas vale abrir o
            menu Titulares com frequência.
          </p>
        </Pergunta>
      </Tema>

      <Tema id="exportar" titulo="Exportar tudo">
        <Pergunta pergunta="O que vem no arquivo .zip?">
          <p>
            Uma pasta por categoria, com uma subpasta por documento contendo o
            arquivo. Acentos e espaços nos nomes viram letras simples e
            &ldquo;_&rdquo;, para abrir sem problemas em qualquer computador.
            Se dois documentos da mesma categoria têm o mesmo título, o
            segundo vira &ldquo;Título (2)&rdquo;.
          </p>
          <p>
            O arquivo <code>manifest.json</code> lista todos os documentos com
            seus dados (título, categoria, cliente, processo, área, tags).
            Documentos anonimizados não têm arquivo, por isso não aparecem nas
            pastas.
          </p>
        </Pergunta>
        <Pergunta pergunta="Por que a exportação foi bloqueada?">
          <p>
            Há um limite de 10 exportações por hora por escritório, de 500
            documentos e de 500 MB por exportação — uma proteção contra a
            retirada em massa dos documentos caso alguém acesse a conta
            indevidamente. Espere uma hora e tente de novo.
          </p>
        </Pergunta>
        <Pergunta pergunta="A exportação substitui o backup?">
          <p>
            Não. A cópia oficial fica na nuvem; a exportação é uma cópia extra
            sob demanda. Guarde o .zip em local seguro: ele contém documentos
            sigilosos.
          </p>
        </Pergunta>
      </Tema>

      <Tema id="equipe" titulo="Equipe e papéis">
        <Pergunta pergunta="Quem pode fazer o quê?">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Administrador:</strong> tudo — inclusive convidar e
              remover pessoas, ver a auditoria, exportar, excluir e anonimizar
              documentos e excluir clientes.
            </li>
            <li>
              <strong>Advogado:</strong> ver, baixar, enviar e editar
              documentos e clientes, e cuidar das solicitações de titulares.
            </li>
            <li>
              <strong>Assistente:</strong> ver, baixar, enviar e editar
              documentos e clientes.
            </li>
          </ul>
          <p>
            O que um papel não permite nem aparece na tela, e o banco de dados
            também recusa — não dá para contornar.
          </p>
        </Pergunta>
        <Pergunta pergunta="Como coloco alguém na equipe?">
          <p>
            Administradores usam o menu <strong>Equipe</strong>: informe o
            e-mail e o papel e clique em &ldquo;Enviar convite&rdquo;. A pessoa
            recebe um link para criar a senha (vale por tempo limitado). Se o
            e-mail não puder ser enviado, a tela mostra o link para você
            repassar.
          </p>
        </Pergunta>
        <Pergunta pergunta="E quando alguém sai do escritório?">
          <p>
            Em Equipe, clique em &ldquo;Remover&rdquo;. O acesso aos documentos
            acaba na hora; nada do que a pessoa cadastrou é apagado, e tudo o
            que ela fez continua na auditoria. O escritório precisa ter sempre
            pelo menos um administrador, e ninguém remove a si mesmo.
          </p>
        </Pergunta>
      </Tema>

      <Tema id="auditoria" titulo="Auditoria">
        <Pergunta pergunta="O que fica registrado?">
          <p>
            Login e logout; criação, alteração, exclusão e anonimização de
            documentos; edição dos dados de um documento (com o valor antes e
            depois);
            cadastro, alteração e exclusão de clientes; e exportações. Cada
            registro mostra data e hora (horário de Brasília) e quem fez.
          </p>
        </Pergunta>
        <Pergunta pergunta="Posso apagar um registro da auditoria?">
          <p>
            Não, e ninguém pode pelo sistema. É isso que dá valor ao registro
            como prova. Os registros são guardados por 3 anos — o prazo em que
            podem ser necessários numa eventual disputa (Código Civil, art.
            206, §3º, V) — e depois são removidos automaticamente.
          </p>
        </Pergunta>
      </Tema>

      <VoltarAoTopo />
    </div>
  );
}
