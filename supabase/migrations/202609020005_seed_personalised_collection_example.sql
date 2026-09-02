-- Connect one existing frame to Personalised Gifts without duplicating the product.
insert into public.product_collections(product_id,collection_id)
select p.id,c.id from public.products p cross join public.collections c
where p.slug='cards-frame' and c.slug in ('personalised-gifts','couple-gifts')
on conflict do nothing;
insert into public.product_personalisation_options(
  product_id,is_personalised,customer_photo_required,customer_instructions_required,
  starting_price,max_people,max_pets,photos_required,available_sizes,available_variants,instructions
)
select id,true,true,true,true,2,2,1,'[]','[]',
  'Upload a clear photograph and describe the details Janvi should preserve.'
from public.products where slug='cards-frame'
on conflict(product_id) do update set
  is_personalised=true,customer_photo_required=true,customer_instructions_required=true,
  starting_price=true,instructions=excluded.instructions,updated_at=now();
