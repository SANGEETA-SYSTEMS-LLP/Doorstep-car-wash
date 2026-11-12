-- =========================================================
-- FILE: 049_service_checklist_seed.sql
-- MODULE: Seed Data
-- PURPOSE: Default service completion checklist
-- RUN AFTER: 047_services_seed.sql
-- =========================================================


-- =========================================================
-- CAR WASH CHECKLIST
-- =========================================================

INSERT INTO public.service_checklist_items (
    service_id,
    title,
    sort_order,
    active
)
SELECT
    s.id,
    item.title,
    item.sort_order,
    TRUE
FROM public.services s
CROSS JOIN (
    VALUES
        ('Vehicle condition checked', 1),
        ('Before service photos uploaded', 2),
        ('Exterior water wash completed', 3),
        ('Car shampoo applied', 4),
        ('Tyres and wheels cleaned', 5),
        ('Exterior body cleaned', 6),
        ('Vehicle dried', 7),
        ('Windows cleaned', 8),
        ('Final inspection completed', 9),
        ('After service photos uploaded', 10)
) AS item(title, sort_order)

WHERE LOWER(s.name) = LOWER('Car Wash')

AND NOT EXISTS (
    SELECT 1
    FROM public.service_checklist_items sci
    WHERE sci.service_id = s.id
      AND LOWER(sci.title) = LOWER(item.title)
);


-- =========================================================
-- INTERIOR CLEANING CHECKLIST
-- =========================================================

INSERT INTO public.service_checklist_items (
    service_id,
    title,
    sort_order,
    active
)
SELECT
    s.id,
    item.title,
    item.sort_order,
    TRUE
FROM public.services s
CROSS JOIN (
    VALUES
        ('Interior condition checked', 1),
        ('Before service photos uploaded', 2),
        ('Seats vacuumed', 3),
        ('Floor vacuumed', 4),
        ('Dashboard cleaned', 5),
        ('Door panels cleaned', 6),
        ('Interior glass cleaned', 7),
        ('Boot area cleaned', 8),
        ('Final interior inspection completed', 9),
        ('After service photos uploaded', 10)
) AS item(title, sort_order)

WHERE LOWER(s.name) = LOWER('Interior Cleaning')

AND NOT EXISTS (
    SELECT 1
    FROM public.service_checklist_items sci
    WHERE sci.service_id = s.id
      AND LOWER(sci.title) = LOWER(item.title)
);


-- =========================================================
-- CAR DETAILING CHECKLIST
-- =========================================================

INSERT INTO public.service_checklist_items (
    service_id,
    title,
    sort_order,
    active
)
SELECT
    s.id,
    item.title,
    item.sort_order,
    TRUE
FROM public.services s
CROSS JOIN (
    VALUES
        ('Vehicle inspection completed', 1),
        ('Before detailing photos uploaded', 2),
        ('Exterior deep cleaning completed', 3),
        ('Tyres and wheels detailed', 4),
        ('Interior vacuum completed', 5),
        ('Dashboard detailed', 6),
        ('Seats cleaned', 7),
        ('Glass cleaned', 8),
        ('Exterior polishing completed', 9),
        ('Final quality inspection completed', 10),
        ('After detailing photos uploaded', 11)
) AS item(title, sort_order)

WHERE LOWER(s.name) = LOWER('Car Detailing')

AND NOT EXISTS (
    SELECT 1
    FROM public.service_checklist_items sci
    WHERE sci.service_id = s.id
      AND LOWER(sci.title) = LOWER(item.title)
);


