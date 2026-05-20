import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useEffect, useRef, useState } from 'react';
import { createHighlighter, type BundledLanguage, type BundledTheme, type HighlighterGeneric } from 'shiki';
import type { ActionState } from '~/lib/runtime/action-runner';
import { workbenchStore } from '~/lib/stores/workbench';
import { assistantExperienceStore } from '~/lib/stores/settings';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { WORK_DIR } from '~/utils/constants';

const highlighterOptions = {
  langs: ['shell'],
  themes: ['light-plus', 'dark-plus'],
};

const shellHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme> =
  import.meta.hot?.data.shellHighlighter ?? (await createHighlighter(highlighterOptions));

if (import.meta.hot) {
  import.meta.hot.data.shellHighlighter = shellHighlighter;
}

interface ArtifactProps {
  messageId: string;
  artifactId: string;
}

/** Human-friendly step text for no-code mode (no file paths or jargon). */
function simpleFriendlyFileStep(filePath: string): string {
  const lower = filePath.toLowerCase();

  if (lower.includes('tailwind') || lower.includes('postcss')) {
    return 'Ajustando la paleta y los estilos globales';
  }

  if (lower.endsWith('.css') || lower.includes('.css')) {
    return 'Actualizando colores y apariencia visual';
  }

  if (/[/\\]app\.(jsx?|tsx?)$/i.test(lower) || lower.includes('main.') || lower.includes('root')) {
    return 'Actualizando la interfaz principal';
  }

  if (lower.includes('component') || lower.includes('/ui/') || lower.includes('components/')) {
    return 'Mejorando una parte de la interfaz';
  }

  if (lower.includes('package.json') || lower.includes('pnpm-lock') || lower.includes('package-lock')) {
    return 'Actualizando dependencias del proyecto';
  }

  if (lower.includes('vite.config') || lower.includes('webpack') || lower.includes('tsconfig')) {
    return 'Ajustando la configuración del entorno de trabajo';
  }

  if (lower.includes('route') || lower.includes('/pages/') || lower.includes('/app/')) {
    return 'Actualizando cómo se organizan las pantallas';
  }

  if (lower.includes('.env')) {
    return 'Ajustando parámetros de conexión';
  }

  if (lower.includes('index.html') || lower.includes('layout')) {
    return 'Actualizando la estructura base de la página';
  }

  if (lower.match(/\.(png|jpe?g|gif|webp|svg|ico)$/)) {
    return 'Añadiendo o cambiando recursos visuales';
  }

  return 'Aplicando un cambio al proyecto';
}

function simpleFriendlyShellSummary(content: string): string {
  const c = content.toLowerCase();

  if (
    c.includes('npm i') ||
    c.includes('npm install') ||
    c.includes('pnpm i') ||
    c.includes('pnpm install') ||
    c.includes('yarn install')
  ) {
    return 'Instalando lo necesario para que todo funcione';
  }

  if (c.includes('git ')) {
    return 'Sincronizando con el historial del proyecto';
  }

  if (c.includes('build') || c.includes('vite build')) {
    return 'Comprobando que la aplicación esté en buen estado';
  }

  if (c.includes('dev') || c.includes('start')) {
    return 'Preparando el entorno de vista previa';
  }

  return 'Ejecutando un paso técnico en segundo plano';
}

export const Artifact = memo(({ artifactId }: ArtifactProps) => {
  const userToggledActions = useRef(false);
  const [showActions, setShowActions] = useState(false);
  const [allActionFinished, setAllActionFinished] = useState(false);
  const simpleExperience = useStore(assistantExperienceStore) === 'simple';

  const artifacts = useStore(workbenchStore.artifacts);
  const artifact = artifacts[artifactId];

  const actions = useStore(
    computed(artifact.runner.actions, (actions) => {
      // Filter out Supabase actions except for migrations
      return Object.values(actions).filter((action) => {
        // Exclude actions with type 'supabase' or actions that contain 'supabase' in their content
        return action.type !== 'supabase' && !(action.type === 'shell' && action.content?.includes('supabase'));
      });
    }),
  );

  const toggleActions = () => {
    userToggledActions.current = true;
    setShowActions(!showActions);
  };

  useEffect(() => {
    if (actions.length && !showActions && !userToggledActions.current) {
      setShowActions(true);
    }

    if (actions.length !== 0 && artifact.type === 'bundled') {
      const finished = !actions.find(
        (action) => action.status !== 'complete' && !(action.type === 'start' && action.status === 'running'),
      );

      if (allActionFinished !== finished) {
        setAllActionFinished(finished);
      }
    }
  }, [actions, artifact.type, allActionFinished]);

  // Determine the dynamic title based on state for bundled artifacts
  const dynamicTitle =
    artifact?.type === 'bundled'
      ? simpleExperience
        ? allActionFinished
          ? artifact.id === 'restored-project-setup'
            ? 'Proyecto restaurado'
            : 'Proyecto listo'
          : artifact.id === 'restored-project-setup'
            ? 'Restaurando tu proyecto…'
            : 'Preparando archivos iniciales…'
        : allActionFinished
          ? artifact.id === 'restored-project-setup'
            ? 'Project Restored'
            : 'Project Created'
          : artifact.id === 'restored-project-setup'
            ? 'Restoring Project...'
            : 'Creating Project...'
      : artifact?.title;

  return (
    <>
      <div className="artifact border border-bolt-elements-borderColor flex flex-col overflow-hidden rounded-lg w-full transition-border duration-150">
        <div className="flex">
          <button
            className="flex items-stretch bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover w-full overflow-hidden"
            onClick={() => {
              const showWorkbench = workbenchStore.showWorkbench.get();
              workbenchStore.showWorkbench.set(!showWorkbench);
            }}
          >
            <div className="px-5 p-3.5 w-full text-left">
              <div className="w-full text-bolt-elements-textPrimary font-medium leading-5 text-sm">
                {/* Use the dynamic title here */}
                {dynamicTitle}
              </div>
              <div className="w-full w-full text-bolt-elements-textSecondary text-xs mt-0.5">
                {simpleExperience ? 'Toca para abrir la vista previa' : 'Click to open Workbench'}
              </div>
            </div>
          </button>
          {artifact.type !== 'bundled' && <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />}
          <AnimatePresence>
            {actions.length && artifact.type !== 'bundled' && (
              <motion.button
                initial={{ width: 0 }}
                animate={{ width: 'auto' }}
                exit={{ width: 0 }}
                transition={{ duration: 0.15, ease: cubicEasingFn }}
                className="bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover"
                onClick={toggleActions}
              >
                <div className="p-4">
                  <div className={showActions ? 'i-ph:caret-up-bold' : 'i-ph:caret-down-bold'}></div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {artifact.type === 'bundled' && (
          <div className="flex items-center gap-1.5 p-5 bg-bolt-elements-actions-background border-t border-bolt-elements-artifacts-borderColor">
            <div className={classNames('text-lg', getIconColor(allActionFinished ? 'complete' : 'running'))}>
              {allActionFinished ? (
                <div className="i-ph:check"></div>
              ) : (
                <div className="i-svg-spinners:90-ring-with-bg"></div>
              )}
            </div>
            <div className="text-bolt-elements-textPrimary font-medium leading-5 text-sm">
              {simpleExperience
                ? allActionFinished
                  ? artifact.id === 'restored-project-setup'
                    ? 'Copia de seguridad aplicada'
                    : 'Archivos iniciales listos'
                  : artifact.id === 'restored-project-setup'
                    ? 'Recuperando tu proyecto desde una copia…'
                    : 'Creando la base del proyecto…'
                : allActionFinished
                  ? artifact.id === 'restored-project-setup'
                    ? 'Restore files from snapshot'
                    : 'Initial files created'
                  : 'Creating initial files'}
            </div>
          </div>
        )}
        <AnimatePresence>
          {artifact.type !== 'bundled' && showActions && actions.length > 0 && (
            <motion.div
              className="actions"
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: '0px' }}
              transition={{ duration: 0.15 }}
            >
              <div className="bg-bolt-elements-artifacts-borderColor h-[1px]" />

              <div className="p-5 text-left bg-bolt-elements-actions-background">
                <ActionList actions={actions} simpleExperience={simpleExperience} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

interface ShellCodeBlockProps {
  classsName?: string;
  code: string;
}

function ShellCodeBlock({ classsName, code }: ShellCodeBlockProps) {
  return (
    <div
      className={classNames('text-xs', classsName)}
      dangerouslySetInnerHTML={{
        __html: shellHighlighter.codeToHtml(code, {
          lang: 'shell',
          theme: 'dark-plus',
        }),
      }}
    ></div>
  );
}

interface ActionListProps {
  actions: ActionState[];
  simpleExperience: boolean;
}

const actionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function openArtifactInWorkbench(filePath: any) {
  if (assistantExperienceStore.get() === 'simple') {
    workbenchStore.currentView.set('preview');
  } else if (workbenchStore.currentView.get() !== 'code') {
    workbenchStore.currentView.set('code');
  }

  workbenchStore.setSelectedFile(`${WORK_DIR}/${filePath}`);
}

const ActionList = memo(({ actions, simpleExperience }: ActionListProps) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <ul className="list-none space-y-2.5">
        {actions.map((action, index) => {
          const { status, type, content } = action;
          const isLast = index === actions.length - 1;
          const showCommandBlock = !simpleExperience && (type === 'shell' || type === 'start');

          return (
            <motion.li
              key={index}
              variants={actionVariants}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.2,
                ease: cubicEasingFn,
              }}
            >
              <div className="flex items-center gap-1.5 text-sm">
                <div className={classNames('text-lg', getIconColor(action.status))}>
                  {status === 'running' ? (
                    <>
                      {type !== 'start' ? (
                        <div className="i-svg-spinners:90-ring-with-bg"></div>
                      ) : (
                        <div className="i-ph:terminal-window-duotone"></div>
                      )}
                    </>
                  ) : status === 'pending' ? (
                    <div className="i-ph:circle-duotone"></div>
                  ) : status === 'complete' ? (
                    <div className="i-ph:check"></div>
                  ) : status === 'failed' || status === 'aborted' ? (
                    <div className="i-ph:x"></div>
                  ) : null}
                </div>
                {type === 'file' ? (
                  simpleExperience ? (
                    <span className="text-bolt-elements-textPrimary">{simpleFriendlyFileStep(action.filePath)}</span>
                  ) : (
                    <div>
                      Create{' '}
                      <code
                        className="bg-bolt-elements-artifacts-inlineCode-background text-bolt-elements-artifacts-inlineCode-text px-1.5 py-1 rounded-md text-bolt-elements-item-contentAccent hover:underline cursor-pointer"
                        onClick={() => openArtifactInWorkbench(action.filePath)}
                      >
                        {action.filePath}
                      </code>
                    </div>
                  )
                ) : type === 'shell' ? (
                  <div className="flex items-center w-full min-h-[28px]">
                    <span className="flex-1">
                      {simpleExperience ? simpleFriendlyShellSummary(content) : 'Run command'}
                    </span>
                  </div>
                ) : type === 'start' ? (
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      workbenchStore.currentView.set('preview');
                    }}
                    className="flex items-center w-full min-h-[28px]"
                  >
                    <span className="flex-1">
                      {simpleExperience ? 'Preparando la vista previa' : 'Start Application'}
                    </span>
                  </a>
                ) : type === 'build' ? (
                  <div className="flex items-center w-full min-h-[28px]">
                    <span className="flex-1">
                      {simpleExperience ? 'Comprobando que la app esté lista para publicarse' : 'Build application'}
                    </span>
                  </div>
                ) : null}
              </div>
              {showCommandBlock && (
                <ShellCodeBlock
                  classsName={classNames('mt-1', {
                    'mb-3.5': !isLast,
                  })}
                  code={content}
                />
              )}
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
});

function getIconColor(status: ActionState['status']) {
  switch (status) {
    case 'pending': {
      return 'text-bolt-elements-textTertiary';
    }
    case 'running': {
      return 'text-bolt-elements-loader-progress';
    }
    case 'complete': {
      return 'text-bolt-elements-icon-success';
    }
    case 'aborted': {
      return 'text-bolt-elements-textSecondary';
    }
    case 'failed': {
      return 'text-bolt-elements-icon-error';
    }
    default: {
      return undefined;
    }
  }
}
