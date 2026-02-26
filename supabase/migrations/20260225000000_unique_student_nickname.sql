-- Migration: Backfill nicknames for existing students and add unique constraint.

DO $$
DECLARE
  adj TEXT[] := ARRAY[
    'Swift','Brave','Clever','Mighty','Noble','Daring','Witty','Gentle','Bold','Keen',
    'Lucky','Calm','Bright','Fierce','Jolly','Silent','Golden','Cosmic','Steady','Agile',
    'Curious','Radiant','Stealthy','Fearless','Wandering','Speedy','Lively','Proud','Sneaky','Charming',
    'Humble','Nimble','Crystal','Crimson','Emerald','Frosty','Rustic','Shadow','Stormy','Amber'
  ];
  ani TEXT[] := ARRAY[
    'Falcon','Tiger','Wolf','Eagle','Dolphin','Panther','Fox','Hawk','Bear','Otter',
    'Raven','Lynx','Owl','Stag','Heron','Badger','Cobra','Jaguar','Puma','Crane',
    'Bison','Shark','Viper','Moose','Finch','Gecko','Ibis','Koala','Lemur','Newt',
    'Panda','Robin','Seal','Wren','Hare','Mink','Toucan','Osprey','Pelican','Sparrow'
  ];
  r RECORD;
  candidate TEXT;
  taken BOOLEAN;
BEGIN
  -- Backfill students with NULL nicknames
  FOR r IN SELECT user_id FROM public.students WHERE nickname IS NULL
  LOOP
    LOOP
      candidate := adj[1 + floor(random() * array_length(adj, 1))::int]
                   || ' '
                   || ani[1 + floor(random() * array_length(ani, 1))::int];
      SELECT EXISTS(
        SELECT 1 FROM public.students WHERE nickname = candidate
      ) INTO taken;
      EXIT WHEN NOT taken;
    END LOOP;

    UPDATE public.students SET nickname = candidate WHERE user_id = r.user_id;
  END LOOP;

  -- Fix pre-existing duplicates: keep first, reassign the rest
  FOR r IN
    SELECT user_id FROM public.students
    WHERE nickname IN (
      SELECT nickname FROM public.students
      WHERE nickname IS NOT NULL
      GROUP BY nickname HAVING COUNT(*) > 1
    )
    AND user_id NOT IN (
      SELECT DISTINCT ON (nickname) user_id
      FROM public.students
      WHERE nickname IS NOT NULL
      ORDER BY nickname, user_id
    )
  LOOP
    LOOP
      candidate := adj[1 + floor(random() * array_length(adj, 1))::int]
                   || ' '
                   || ani[1 + floor(random() * array_length(ani, 1))::int];
      SELECT EXISTS(
        SELECT 1 FROM public.students WHERE nickname = candidate
      ) INTO taken;
      EXIT WHEN NOT taken;
    END LOOP;

    UPDATE public.students SET nickname = candidate WHERE user_id = r.user_id;
  END LOOP;
END $$;

-- Ensure no two students can share the same nickname going forward.
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_nickname_unique
  ON public.students (nickname)
  WHERE nickname IS NOT NULL;
