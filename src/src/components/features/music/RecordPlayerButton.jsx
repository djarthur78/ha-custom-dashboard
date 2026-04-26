/**
 * RecordPlayerButton
 *
 * One tap → modal that drives Sonos to play the line-in source on Dining Room
 * (where the record player is wired in) and groups any other rooms the user
 * picks. Because the line-in source name varies per Sonos firmware, we resolve
 * it from the speaker's sourceList attribute at runtime — fall back to
 * "Line-In" if the speaker is offline or doesn't expose a list.
 */

import { useMemo, useState } from 'react';
import { Disc3, Square } from 'lucide-react';
import { Modal, ModalFooter } from '../../common/Modal';
import { usePlaybackControls } from './hooks/usePlaybackControls';
import { useSpeakerGroups } from './hooks/useSpeakerGroups';

const DINING_ROOM_ENTITY = 'media_player.dining_room';

function resolveLineInSource(diningRoom) {
  const list = diningRoom?.sourceList || [];
  const match = list.find((s) => /line[\s-]?in/i.test(s));
  return match || 'Line-In';
}

export function RecordPlayerButton({ speakers }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState(new Set());
  const [busy, setBusy] = useState(false);

  const controls = usePlaybackControls();
  const groupControls = useSpeakerGroups();

  const diningRoom = speakers.find((s) => s.entityId === DINING_ROOM_ENTITY);
  const otherRooms = useMemo(
    () => speakers.filter((s) => s.entityId !== DINING_ROOM_ENTITY),
    [speakers]
  );

  // Detect "playing" state — line-in is active when Dining Room's source matches.
  const lineInSource = resolveLineInSource(diningRoom);
  const isLineInActive = diningRoom?.source && /line[\s-]?in/i.test(diningRoom.source);

  const isOffline = !diningRoom || diningRoom.state === 'unavailable';

  const toggleRoom = (entityId) => {
    setSelectedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(entityId)) next.delete(entityId);
      else next.add(entityId);
      return next;
    });
  };

  const handlePlay = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await controls.selectSource(DINING_ROOM_ENTITY, lineInSource);
      const groupMembers = [DINING_ROOM_ENTITY, ...selectedRooms];
      if (groupMembers.length > 1) {
        await groupControls.groupSpeakers(DINING_ROOM_ENTITY, groupMembers);
      }
      await controls.play(DINING_ROOM_ENTITY);
      setIsOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Pause first so the line-in audio cuts immediately, then ungroup.
      await controls.pause(DINING_ROOM_ENTITY);
      await groupControls.ungroupAll(speakers);
      setSelectedRooms(new Set());
      setIsOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isOffline}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                   text-base font-semibold transition-all hover:shadow-md
                   disabled:opacity-40 disabled:cursor-not-allowed"
        style={isLineInActive
          ? {
              background: 'linear-gradient(135deg, #b5453a, #8a3329)',
              color: 'white',
              border: '1px solid transparent',
            }
          : {
              backgroundColor: 'var(--ds-warm-inactive-bg)',
              color: 'var(--ds-text)',
              border: '1px solid var(--ds-border)',
            }
        }
        title={isOffline ? 'Dining Room speaker offline' : 'Play the record player'}
      >
        <Disc3 size={18} className={isLineInActive ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
        {isLineInActive ? 'Record Player Playing' : 'Play Record'}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Play Record Player"
        size="md"
      >
        <div className="space-y-4">
          {/* Source row — always Dining Room + Line-In */}
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--ds-warm-inactive-bg)' }}>
            <Disc3 size={20} style={{ color: 'var(--ds-accent)' }} />
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: 'var(--ds-text)' }}>
                Source: Dining Room → {lineInSource}
              </div>
              <div className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
                Always selected — the record player is wired here.
              </div>
            </div>
          </div>

          {/* Room picker */}
          <div>
            <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--ds-text-secondary)' }}>
              Also play in
            </div>
            <div className="grid grid-cols-2 gap-2">
              {otherRooms.map((room) => {
                const checked = selectedRooms.has(room.entityId);
                const offline = room.state === 'unavailable';
                return (
                  <label
                    key={room.entityId}
                    className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors
                                ${offline ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--ds-warm-inactive-bg)]'}`}
                    style={checked
                      ? { backgroundColor: 'var(--ds-accent)', color: 'white' }
                      : { border: '1px solid var(--ds-border)' }
                    }
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={offline}
                      onChange={() => toggleRoom(room.entityId)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">{room.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <ModalFooter>
          {isLineInActive && (
            <button
              onClick={handleStop}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                         transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--ds-state-off, #b5453a)', color: 'white' }}
            >
              <Square size={14} fill="white" />
              Stop
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--ds-warm-inactive-bg)', color: 'var(--ds-text)' }}
          >
            Cancel
          </button>
          <button
            onClick={handlePlay}
            disabled={busy}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold
                       transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--ds-accent)', color: 'white' }}
          >
            {busy ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Disc3 size={14} />
            )}
            Play
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}
