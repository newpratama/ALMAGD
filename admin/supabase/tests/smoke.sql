begin;
do $$
declare v1 int; v1r1 int; g uuid; b1 uuid; ok boolean;
begin
  select id into v1 from units where name = 'Villa 1';
  select id into v1r1 from units where name = 'Villa 1 - Kamar 1';
  if (select count(*) from units where kind='room') <> 72 then raise exception 'FAIL room count'; end if;
  if (select count(*) from units where kind='villa') <> 24 then raise exception 'FAIL villa count'; end if;
  raise notice 'PASS unit counts';

  insert into guests(full_name) values ('Test Guest') returning id into g;

  -- 1) whole villa booking occupies its 4 rooms
  insert into bookings(guest_id, unit_id, check_in, check_out, source_code, total_amount)
  values (g, v1, '2030-01-10', '2030-01-12', 'walk_in', 2000000) returning id into b1;
  if (select count(*) from room_occupancy where booking_id = b1) <> 4 then raise exception 'FAIL villa occupancy'; end if;
  raise notice 'PASS villa occupies rooms';

  -- 2) booking one of its rooms on overlapping night must fail
  ok := false;
  begin
    insert into bookings(guest_id, unit_id, check_in, check_out, source_code, total_amount)
    values (g, v1r1, '2030-01-11', '2030-01-13', 'walk_in', 300000);
  exception when exclusion_violation then ok := true;
  end;
  if not ok then raise exception 'FAIL double booking allowed'; end if;
  raise notice 'PASS double booking rejected';

  -- 3) check-out day is free
  insert into bookings(guest_id, unit_id, check_in, check_out, source_code, total_amount)
  values (g, v1r1, '2030-01-12', '2030-01-13', 'walk_in', 300000);
  raise notice 'PASS check-out day bookable';

  -- 4) cancelling frees the rooms
  update bookings set status = 'cancelled' where id = b1;
  if exists (select 1 from room_occupancy where booking_id = b1) then raise exception 'FAIL cancel did not free'; end if;
  raise notice 'PASS cancel frees rooms';

  -- 5) available_units excludes Villa 1 when one of its rooms is taken
  if exists (select 1 from available_units('2030-01-12','2030-01-13') where id = v1) then raise exception 'FAIL availability'; end if;
  if not exists (select 1 from available_units('2030-01-12','2030-01-13') where name = 'Villa 1 - Kamar 2') then raise exception 'FAIL availability 2'; end if;
  raise notice 'PASS available_units';

  -- 6) payment overview
  insert into payments(booking_id, amount, method) values (b1, 500000, 'cash');
  if (select payment_status from booking_overview where id = b1) <> 'refund_due' then raise exception 'FAIL overview'; end if;
  raise notice 'PASS booking_overview';
end $$;
rollback;
