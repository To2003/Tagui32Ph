import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

const componentes: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-8 font-heading text-2xl tracking-wide text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 font-heading text-xl tracking-wide text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 font-heading text-lg tracking-wide text-foreground first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 leading-relaxed text-muted-foreground last:mb-0">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  ul: ({ children }) => (
    <ul className="mb-4 ml-5 list-disc space-y-1 text-muted-foreground last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 ml-5 list-decimal space-y-1 text-muted-foreground last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline-offset-4 hover:underline"
    >
      {children}
    </a>
  ),
};

// Wrapper único para todo el texto largo editable desde el admin (términos,
// sobre mí, etc.). Sin rehype-raw no se interpreta HTML crudo del texto, y
// rehype-sanitize además filtra protocolos peligrosos en links/imágenes
// (javascript:, data:, etc.) — así el admin puede escribir Markdown libre
// sin abrir la puerta a XSS.
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={componentes}
    >
      {children}
    </ReactMarkdown>
  );
}
