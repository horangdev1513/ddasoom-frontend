import { type Editor, useEditorState } from '@tiptap/react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Undo2,
  Redo2,
} from 'lucide-react';
import { Toggle } from '@/shared/components/ui/toggle';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';

interface EditorToolbarProps {
  editor: Editor | null;
  onInsertImage: () => void;
}

// 관리자 공지/FAQ용 최소 툴바.
// 제목(H2/H3)·굵게·기울임·리스트·링크·이미지·실행취소/재실행만 제공한다.
export function EditorToolbar({ editor, onInsertImage }: EditorToolbarProps) {
  // 선택 영역 변화에 따라 활성 상태를 반응적으로 구독(v3: useEditorState).
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            h2: e.isActive('heading', { level: 2 }),
            h3: e.isActive('heading', { level: 3 }),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            link: e.isActive('link'),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  if (!editor || !state) return null;

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('링크 URL을 입력하세요', previous ?? '');
    if (url === null) return; // 취소
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
      <Toggle
        size="sm"
        pressed={state.h2}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="제목 2"
      >
        <Heading2 />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.h3}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        aria-label="제목 3"
      >
        <Heading3 />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={state.bold}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="굵게"
      >
        <Bold />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.italic}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="기울임"
      >
        <Italic />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={state.bullet}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="글머리 목록"
      >
        <List />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.ordered}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="번호 목록"
      >
        <ListOrdered />
      </Toggle>
      <Toggle size="sm" pressed={state.link} onPressedChange={setLink} aria-label="링크">
        <Link2 />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button type="button" variant="ghost" size="sm" onClick={onInsertImage} aria-label="이미지 삽입">
        <ImageIcon />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
        aria-label="실행 취소"
      >
        <Undo2 />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
        aria-label="다시 실행"
      >
        <Redo2 />
      </Button>
    </div>
  );
}
