import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

@Controller('events')
export class EventController {
    constructor(private readonly eventService: EventService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    create(@Body() createEventDto: CreateEventDto, @Request() req) {
        return this.eventService.create(createEventDto, req.user);
    }

    @Get()
    findAll(@Request() req) {
        return this.eventService.findAll(false);
    }

    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    findAllAdmin() {
        return this.eventService.findAll(true);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.eventService.findOne(id, false);
    }

    @Get('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    findOneAdmin(@Param('id') id: string) {
        return this.eventService.findOne(id, true);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
        return this.eventService.update(id, updateEventDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.eventService.remove(id);
    }
}
