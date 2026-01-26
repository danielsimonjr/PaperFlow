import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { StampTool } from '@/components/annotations/StampTool';
import { StampPicker } from '@/components/annotations/StampPicker';
import { useAnnotationStore } from '@/stores/annotationStore';
import { PRESET_STAMPS } from '@/constants/stamps';

// Mock the annotation store
vi.mock('@/stores/annotationStore', () => ({
  useAnnotationStore: vi.fn(),
}));

describe('Stamp Components', () => {
  const mockAddAnnotation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAnnotationStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        addAnnotation: mockAddAnnotation,
      };
      return selector(state);
    });
  });

  describe('StampTool', () => {
    it('renders nothing when not active', () => {
      const { container } = render(
        <StampTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={false}
          stampType="approved"
        />
      );

      expect(container.querySelector('svg')).toBeNull();
    });

    it('renders SVG when active', () => {
      const { container } = render(
        <StampTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={true}
          stampType="approved"
        />
      );

      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('has pointer cursor when active', () => {
      const { container } = render(
        <StampTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={true}
          stampType="approved"
        />
      );

      const svg = container.querySelector('svg');
      expect(svg?.classList.contains('cursor-pointer')).toBe(true);
    });

    it('creates stamp annotation on click', () => {
      const { container } = render(
        <StampTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={true}
          stampType="approved"
        />
      );

      const svg = container.querySelector('svg')!;

      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Need to trigger mouse move first to set position
      fireEvent.mouseMove(svg, { clientX: 400, clientY: 300 });
      fireEvent.click(svg, { clientX: 400, clientY: 300 });

      expect(mockAddAnnotation).toHaveBeenCalledTimes(1);
      expect(mockAddAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'stamp',
          stampType: 'approved',
          pageIndex: 0,
        })
      );
    });
  });

  describe('StampPicker', () => {
    it('renders all preset stamps', () => {
      const onSelect = vi.fn();

      const { getByText } = render(
        <StampPicker
          selectedStamp="approved"
          onSelect={onSelect}
        />
      );

      // Check that preset stamps are rendered
      expect(getByText('APPROVED')).toBeTruthy();
      expect(getByText('REJECTED')).toBeTruthy();
      expect(getByText('CONFIDENTIAL')).toBeTruthy();
      expect(getByText('DRAFT')).toBeTruthy();
      expect(getByText('FINAL')).toBeTruthy();
      expect(getByText('FOR REVIEW')).toBeTruthy();
    });

    it('calls onSelect when stamp is clicked', () => {
      const onSelect = vi.fn();

      const { getByText } = render(
        <StampPicker
          selectedStamp={null}
          onSelect={onSelect}
        />
      );

      fireEvent.click(getByText('APPROVED').closest('button')!);

      expect(onSelect).toHaveBeenCalledWith('approved');
    });

    it('shows create custom stamp button when onCreateCustom is provided', () => {
      const onSelect = vi.fn();
      const onCreateCustom = vi.fn();

      const { getByText } = render(
        <StampPicker
          selectedStamp={null}
          onSelect={onSelect}
          onCreateCustom={onCreateCustom}
        />
      );

      const createButton = getByText('Create Custom Stamp');
      expect(createButton).toBeTruthy();

      fireEvent.click(createButton);
      expect(onCreateCustom).toHaveBeenCalled();
    });
  });

  describe('Preset Stamps', () => {
    it('has 6 preset stamps defined', () => {
      expect(PRESET_STAMPS).toHaveLength(6);
    });

    it('all preset stamps have required properties', () => {
      PRESET_STAMPS.forEach((stamp) => {
        expect(stamp.id).toBeTruthy();
        expect(stamp.name).toBeTruthy();
        expect(stamp.text).toBeTruthy();
        expect(stamp.color).toBeTruthy();
        expect(stamp.backgroundColor).toBeTruthy();
        expect(stamp.borderColor).toBeTruthy();
      });
    });

    it('preset stamp IDs are unique', () => {
      const ids = PRESET_STAMPS.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
