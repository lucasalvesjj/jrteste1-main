import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { company } from "@/data/company";

const PoliticaPrivacidade = () => {
  return (
    <>
      <Helmet>
        <title>Política de Privacidade | {company.shortName}</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={company.siteUrl} />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        <div className="container-custom py-12 md:py-20">
          <div className="mx-auto max-w-3xl">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              ← Voltar ao início
            </Link>

            <h1 className="mb-2 font-heading text-3xl font-bold text-foreground md:text-4xl">
              Política de Privacidade
            </h1>
            <p className="mb-10 text-sm text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>

            <div className="prose prose-slate max-w-none space-y-8 text-foreground">

              <section>
                <h2 className="mb-3 font-heading text-xl font-bold text-foreground">1. Quem somos</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  A <strong className="text-foreground">{company.name}</strong>, inscrita no CNPJ sob o nº <strong className="text-foreground">28.532.489/0001-61</strong>, é uma empresa com sede em {company.fullAddress},
                  especializada na comercialização de ferramentas, máquinas e equipamentos de irrigação.
                  Esta Política de Privacidade descreve como coletamos, usamos e protegemos as informações
                  dos visitantes do nosso site <strong className="text-foreground">{company.siteUrl}</strong>.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-bold text-foreground">2. Informações que coletamos</h2>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  Podemos coletar as seguintes informações quando você visita ou interage com nosso site:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  <li><strong className="text-foreground">Dados de contato:</strong> nome, e-mail e telefone fornecidos voluntariamente em formulários de contato.</li>
                  <li><strong className="text-foreground">Dados de navegação:</strong> endereço IP, tipo de navegador, páginas visitadas, tempo de permanência e origem do acesso.</li>
                  <li><strong className="text-foreground">Cookies:</strong> pequenos arquivos armazenados no seu dispositivo para melhorar sua experiência de navegação.</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-bold text-foreground">3. Como usamos suas informações</h2>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  As informações coletadas são utilizadas exclusivamente para:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>Responder às suas mensagens e solicitações de contato;</li>
                  <li>Melhorar o funcionamento e o conteúdo do nosso site;</li>
                  <li>Analisar o desempenho das páginas e identificar melhorias;</li>
                  <li>Cumprir obrigações legais ou regulatórias quando aplicável.</li>
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros
                  para fins comerciais sem o seu consentimento expresso.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-bold text-foreground">4. Cookies</h2>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  Nosso site utiliza cookies para proporcionar uma melhor experiência de navegação. Os cookies podem ser:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  <li><strong className="text-foreground">Essenciais:</strong> necessários para o funcionamento básico do site;</li>
                  <li><strong className="text-foreground">Analíticos:</strong> usados para entender como os visitantes interagem com o site (ex.: Google Analytics);</li>
                  <li><strong className="text-foreground">De preferência:</strong> armazenam suas escolhas, como o aceite desta política.</li>
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Você pode desativar os cookies nas configurações do seu navegador. No entanto, isso pode
                  afetar algumas funcionalidades do site.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-bold text-foreground">5. Compartilhamento de dados</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Podemos compartilhar suas informações com prestadores de serviços terceirizados que nos auxiliam
                  na operação do site (como ferramentas de análise e hospedagem), sempre sob acordo de
                  confidencialidade e apenas na medida necessária para a prestação do serviço.
                  Também podemos divulgar informações quando exigido por lei ou autoridade competente.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-bold text-foreground">6. Segurança das informações</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Adotamos medidas técnicas e organizacionais adequadas para proteger suas informações pessoais
                  contra acesso não autorizado, alteração, divulgação ou destruição. No entanto, nenhum método
                  de transmissão pela internet é 100% seguro, e não podemos garantir segurança absoluta.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-bold text-foreground">7. Seus direitos (LGPD)</h2>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>Confirmar a existência de tratamento dos seus dados;</li>
                  <li>Acessar seus dados pessoais que possuímos;</li>
                  <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
                  <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                  <li>Revogar o consentimento a qualquer momento;</li>
                  <li>Solicitar a portabilidade dos seus dados a outro fornecedor.</li>
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Para exercer qualquer um desses direitos, entre em contato conosco pelo e-mail{" "}
                  <a href={`mailto:${company.email}`} className="font-medium text-primary hover:underline">
                    {company.email}
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-bold text-foreground">8. Retenção de dados</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Armazenamos seus dados apenas pelo tempo necessário para cumprir as finalidades descritas
                  nesta política ou conforme exigido por obrigações legais. Após esse período, os dados são
                  eliminados de forma segura.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-bold text-foreground">9. Links externos</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Nosso site pode conter links para sites de terceiros. Não somos responsáveis pelas práticas
                  de privacidade desses sites e recomendamos que você leia as respectivas políticas de
                  privacidade antes de fornecer qualquer informação.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-bold text-foreground">10. Alterações nesta política</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Podemos atualizar esta Política de Privacidade periodicamente. Recomendamos que você a
                  revise regularmente. Alterações significativas serão comunicadas de forma destacada em
                  nosso site. O uso continuado do site após as alterações implica aceitação da política atualizada.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-bold text-foreground">11. Contato</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Em caso de dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados,
                  entre em contato:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <li><strong className="text-foreground">Empresa:</strong> {company.name}</li>
                  <li><strong className="text-foreground">CNPJ:</strong> 28.532.489/0001-61</li>
                  <li>
                    <strong className="text-foreground">E-mail:</strong>{" "}
                    <a href={`mailto:${company.email}`} className="font-medium text-primary hover:underline">
                      {company.email}
                    </a>
                  </li>
                  <li><strong className="text-foreground">Telefone:</strong> {company.phone}</li>
                  <li><strong className="text-foreground">Endereço:</strong> {company.fullAddress}</li>
                </ul>
              </section>

            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  );
};

export default PoliticaPrivacidade;
